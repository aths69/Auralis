import requests
import io

base_url = "http://localhost:8000"

# 1. Signup
email = "testpost@example.com"
password = "Password123!"
username = "testpost"

try:
    res = requests.post(f"{base_url}/signup", data={
        "email": email,
        "password": password,
        "username": username
    })
    print("Signup:", res.status_code, res.text)
except Exception as e:
    print("Signup failed", e)

# 2. Login
res = requests.post(f"{base_url}/login", data={
    "username": email,
    "password": password
})
print("Login:", res.status_code)
token = res.json().get("access_token")

headers = {"Authorization": f"Bearer {token}"}

# Test a) Text-only post
res = requests.post(f"{base_url}/posts/create", data={"captions": "This is a text only post"}, headers=headers)
print("Text only:", res.status_code, res.text)
assert res.status_code == 200

# Test b) Image-only post
img_data = b"fake image content"
res = requests.post(f"{base_url}/posts/create", files={"image": ("test.jpg", img_data, "image/jpeg")}, headers=headers)
print("Image only:", res.status_code, res.text)
assert res.status_code == 200

# Test c) Image + text post
res = requests.post(f"{base_url}/posts/create", data={"captions": "Image and text"}, files={"image": ("test2.jpg", img_data, "image/jpeg")}, headers=headers)
print("Image + text:", res.status_code, res.text)
assert res.status_code == 200

# Test d) Empty post
res = requests.post(f"{base_url}/posts/create", headers=headers)
print("Empty post:", res.status_code, res.text)
assert res.status_code == 400

print("All tests passed!")
