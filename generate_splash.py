from PIL import Image, ImageDraw, ImageFont

width = 1000
height = 1000

img = Image.new('RGB', (width, height), color='#000000')
d = ImageDraw.Draw(img)

try:
    font = ImageFont.truetype("node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf", 150)
except Exception as e:
    print("Font load error:", e)
    font = ImageFont.load_default()

text_s = "S"
text_rest = "martStay"

# approximate center manually using getlength
s_w = font.getlength(text_s)
rest_w = font.getlength(text_rest)
total_w = s_w + rest_w

x = (width - total_w) / 2
y = (height - 150) / 2  # approximate height offset

d.text((x, y), text_s, font=font, fill="#ffffff")
d.text((x + s_w, y), text_rest, font=font, fill="#777777")

img.save('assets/brand_splash_new.png')
print("Image generated!")
