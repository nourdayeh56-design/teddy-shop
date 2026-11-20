# Teddy Bear Shop — Complete project

## Files
- `index.html`: storefront
- `css/style.css`: responsive design
- `js/script.js`: cart, search, filters, product details, promo code, delivery estimate, reviews, checkout and contact form
- `google-apps-script/Code.gs`: Google Sheets + email backend + protected admin functions
- `google-apps-script/Admin.html`: admin dashboard served by Apps Script

## 1. Put the files in your project
Keep this structure:
```
Teddy-Bear-Shop/
  index.html
  css/style.css
  js/script.js
  images/
    bear1.jpg
    bear2.jpg
    bear3.jpg
    bear4.jpg
    bear5.jpg
```
Copy the existing `images` folder from your current project. The HTML expects those exact image names.

## 2. Connect Google Sheets
1. Open the Google Sheet used by your shop.
2. Extensions > Apps Script.
3. Replace the contents of `Code.gs` with `google-apps-script/Code.gs`.
4. In Apps Script, click **+** > **HTML**, name it exactly `Admin`, and paste `Admin.html`.
5. Save.
6. Select `setupSheets` in the function dropdown and Run it once. Approve the Google permissions.
7. Deploy > New deployment > Web app.
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Deploy and copy the `/exec` URL.
9. Paste that URL into `SHEET_URL` at the top of `js/script.js`.
10. If you already have a deployment, deploy a **new version** after every Apps Script change.

The script stores orders in the `Orders` tab and contact messages in the `Messages` tab. Email notifications are sent to `nourdayeh6@gmail.com` (the address used in your original script). Change the two `to:` email values in `Code.gs` if you want notifications somewhere else.

## 3. Configure admin login
In Apps Script:
1. Open Project Settings (gear icon).
2. Under Script Properties, add:
   - Property: `ADMIN_PASSWORD`
   - Value: choose a strong, unique password
3. Save and deploy a new version.
4. Admin page URL: append `?page=admin` to your deployed `/exec` URL.
5. Sign in with the password. The password is checked server-side; do not add it to `script.js`.

## 4. Demo settings to customize
Open `js/script.js`:
- `DELIVERY_FEES`: replace sample governorate delivery prices with your courier's real prices.
- `FREE_DELIVERY_FROM`: set your real free-delivery threshold.
- `PROMO_CODES`: edit or remove demo codes.
- Product stock is currently sample data in each `.product-card` as `data-stock`. It is only a browser-side demo and is NOT a shared live inventory system. For a real shop, stock must be checked and reduced on the server/Sheet during order processing.
- Product prices, names and descriptions are in the `index.html` product cards.

## 5. Important limitations / launch checklist
- Checkout is **Cash on Delivery only**. No online payment gateway is connected.
- Search, filters, sorting, product details and cart run in the browser.
- Reviews are saved only in the visitor's own browser (localStorage). They are not shared, moderated or verified.
- Delivery prices and product stock are sample configuration. Confirm them before accepting real orders.
- Google Apps Script `ContentService` responses do not provide a reliable readable CORS response to this static page. The storefront uses `no-cors`; the browser cannot verify that Google Sheets saved an order. Check the `Orders` tab and email notifications during testing. Do not tell customers their order is confirmed until you verify it.
- A static HTML site cannot safely contain private admin credentials. The included admin dashboard authenticates through server-side Apps Script functions. Keep the `ADMIN_PASSWORD` private.
- This is a small-shop starter project, not a complete production commerce platform. Add server-side stock validation, spam protection/rate limiting, privacy/returns/delivery policies, and a tested payment provider before scaling.

## 6. Publish with Netlify
1. Make sure the folder contains `index.html`, `css`, `js`, and `images`.
2. Create/sign in to Netlify.
3. Choose Add new site > Deploy manually (or connect your Git repository).
4. Drag the whole project folder (not just `index.html`) into the deployment area.
5. Test the public URL on phone and computer.
6. Add a custom domain only after the site works correctly.

## 7. Before launch
- Place a test order and confirm it appears in `Orders`.
- Confirm the email arrives.
- Send a test contact message and confirm it appears in `Messages`.
- Test each promo code and each delivery fee.
- Check all image paths and mobile layout.
- Replace sample stock, prices, policies and delivery rates with real information.
# teddy-shop
