import unittest
import io
from PIL import Image
from smartfit.images import load_image, compose_comparison, blend_comparison
from smartfit.quality import analyze

class Tests(unittest.TestCase):
    def setUp(self):
        self.img=Image.new('RGB',(600,900),(120,135,165))
        b=io.BytesIO();self.img.save(b,'PNG');self.raw=b.getvalue()
    def test_valid(self):
        img,diag=load_image(self.raw)
        self.assertEqual(img.size,(600,900))
        self.assertEqual(diag.width,600)
    def test_reject_nonimage(self):
        with self.assertRaises(ValueError):load_image(b'this is not an image')
    def test_compare(self):
        cmp=compose_comparison(self.img,self.img)
        self.assertEqual(cmp.width,1200)
        self.assertEqual(blend_comparison(self.img,self.img,0.3).size,self.img.size)
    def test_quality(self):
        self.assertLess(analyze(self.img,self.img).border_change,0.01)

if __name__=='__main__':unittest.main()
