"""HTTP integration tests without loading model weights or CUDA."""
import io
import time
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from PIL import Image
from smartfit.api import app


def image_bytes(color=(80, 90, 110)):
    out=io.BytesIO();Image.new('RGB',(576,864),color).save(out, 'PNG');return out.getvalue()


class WebAPITests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client=TestClient(app)

    def upload(self, **fields):
        return self.client.post('/api/v1/jobs',
            files={'person':('p.png',image_bytes(),'image/png'),
                   'garment':('g.png',image_bytes((230,160,30)),'image/png')},
            data=fields)

    def test_async_job_status_image(self):
        fake=Image.new('RGB',(576,864),(80,99,121))
        with patch('smartfit.service.ENGINE.run',return_value=fake):
            response=self.upload(category='tops',steps='20',segmentation_free='true')
            self.assertEqual(response.status_code,202,response.text)
            data=response.json(); self.assertRegex(data['job_id'],r'^[a-f0-9]{32}$')
            for i in range(40):
                status=self.client.get(data['status_url'])
                self.assertEqual(status.status_code,200)
                state=status.json()
                if state['status'] in ('completed','failed'):
                    break
                time.sleep(.1)
        self.assertEqual(state['status'],'completed',state)
        self.assertTrue(state['result']['id'])
        result=self.client.get(state['result']['image_url'])
        self.assertEqual(result.status_code,200)
        self.assertEqual(result.headers['content-type'],'image/png')
        self.assertTrue(result.content.startswith(b'\x89PNG'))

    def test_invalid_category_rejected(self):
        response=self.upload(category='shirt-fake')
        self.assertEqual(response.status_code,422)

    def test_invalid_binary_rejected(self):
        response=self.client.post('/api/v1/jobs',files={
            'person':('a.png',b'not image data','image/png'),
            'garment':('b.png',image_bytes(),'image/png')})
        self.assertEqual(response.status_code,422)

    def test_key_required_when_configured(self):
        with patch('smartfit.web_api.API_KEY','secret_for_test'):
            response=self.upload(category='tops')
            self.assertEqual(response.status_code,401)
        self.assertEqual(self.client.get('/api/v1/jobs/'+'x'*32).status_code,404)

    def test_upload_size_and_type(self):
        response=self.client.post('/api/v1/jobs',files={
            'person':('a.txt',b'bad','text/plain'),
            'garment':('g.png',image_bytes(),'image/png')})
        self.assertEqual(response.status_code,415)


if __name__=='__main__':
    unittest.main()
