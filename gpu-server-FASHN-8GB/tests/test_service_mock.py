"""Integration test without GPU: verifies parameter plumbing and saved PNG/SQLite."""
import io
import os
import unittest
from pathlib import Path
from unittest.mock import patch
from PIL import Image
from smartfit.service import RequestOptions, process
from smartfit.storage import get_run

class ServiceTests(unittest.TestCase):
    @staticmethod
    def png(rgb):
        img=Image.new('RGB',(576,864),rgb)
        stream=io.BytesIO();img.save(stream,'PNG');return stream.getvalue()
    def test_process_persists_images(self):
        person=self.png((90,100,110))
        garment=self.png((20,110,220))
        fake=Image.new('RGB',(576,864),(88,99,111))
        with patch('smartfit.service.ENGINE.run', return_value=fake):
            result=process(person,garment,RequestOptions(category='tops',seed=17,steps=20))
        self.assertTrue(Path(result['paths']['output']).is_file())
        self.assertTrue(Path(result['paths']['comparison']).is_file())
        self.assertEqual(result['seed'],17)
        db=get_run(result['id'])
        self.assertEqual(db['category'],'tops')
        self.assertEqual(db['steps'],20)
    def test_bad_category(self):
        with self.assertRaises(ValueError): RequestOptions(category='wrong').validate()
    def test_invalid_guidance(self):
        with self.assertRaises(ValueError): RequestOptions(guidance=9).validate()
