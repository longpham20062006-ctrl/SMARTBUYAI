import os
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Check the 8 unreferenced images
unref_product_images = [
    "/images/san-pham/quan-ao-nam/quan/quan-dai/1792798442795_348043404565674403_5540743654312280467_a80592e298195e259619ac4731c03dd9.jpg",
    "/images/san-pham/quan-ao-nu/vay/váy_corset_gothic_ren_hoa_văn_victorian.png",
    "/images/san-pham/quan-ao-nu/vay/váy_corset_gothic_đen_ngà_cầu_kỳ.png",
    "/images/san-pham/quan-ao-nu/vay/váy_corset_gothic_đen_trắng_nhiều_tầng.png",
    "/images/san-pham/quan-ao-nu/vay/váy_corset_kẻ_đỏ_đen_cổ_điển.png",
    "/images/san-pham/quan-ao-nu/vay/váy_dạ_hội_corset_đen_trắng_ren_hoa.png",
    "/images/san-pham/quan-ao-nu/vay/váy_gothic_lolita_cổ_yếm_ren_đen_ivory.png",
    "/images/san-pham/quan-ao-nu/vay/váy_gothic_ren_hoa_đen_trắng_thanh_lịch.png"
]

print("Checking existence on disk:")
for img in unref_product_images:
    p = os.path.join("public", img.lstrip("/"))
    print(f"Exists: {os.path.exists(p)} -> {p}")

