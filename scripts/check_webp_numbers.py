import os

files = os.listdir('public/images/san-pham/quan-ao-nu/vay')
webp_numbers = []
for f in files:
    if f.startswith('vay_') and f.endswith('.webp'):
        try:
            num = int(f.replace('vay_', '').replace('.webp', ''))
            webp_numbers.append(num)
        except ValueError:
            pass

webp_numbers.sort()
print("Webp count:", len(webp_numbers))
print("Webp numbers:", webp_numbers)

missing_nums = [i for i in range(1, 73) if i not in webp_numbers]
print("Missing numbers between 1 and 72:", missing_nums)

