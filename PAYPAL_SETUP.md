# PayPal sandbox setup (Oscar's part)

1. https://developer.paypal.com -> Log in -> Apps & Credentials -> Sandbox -> Create App
   Copy the Client ID and Secret.
2. Put them in acg_store_backend/.env:
   PAYPAL_MODE=sandbox
   PAYPAL_CLIENT_ID=...
   PAYPAL_SECRET=...
   PAYPAL_CURRENCY=MYR      (use USD if PayPal rejects MYR for your sandbox business account)
   FRONTEND_URL=http://localhost:5173
3. Then: php artisan config:clear
4. Test buyer: developer.paypal.com -> Testing Tools -> Sandbox Accounts -> use a *Personal* account's email/password on the PayPal login page.
