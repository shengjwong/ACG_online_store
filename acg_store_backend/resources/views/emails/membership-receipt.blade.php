<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f4f4f7; padding: 24px; color: #222;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 12px; letter-spacing: 1px; color: #888;">
      <tr>
        <td><strong>ACG STORE</strong></td>
        <td align="right">PAYMENT RECEIPT</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 22px 0 8px;">
      <div style="display: inline-block; width: 46px; height: 46px; line-height: 46px; border-radius: 50%; background: #4caf50; color: #fff; font-size: 24px;">&#10003;</div>
      <h2 style="margin: 12px 0 4px;">Payment Successful</h2>
      <p style="margin: 0; color: #555;">Thank you for renewing your ACG Store membership, {{ $user->name }}.</p>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <div style="font-size: 12px; letter-spacing: 1px; color: #888;">TOTAL PAID</div>
      <div style="font-size: 30px; font-weight: bold;">RM {{ number_format($payment->amount, 2) }}</div>
    </div>

    <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; font-size: 14px; border-top: 1px solid #eee;">
      <tr style="border-bottom: 1px solid #eee;"><td style="color: #888;">Receipt No.</td><td align="right"><strong>{{ $receiptNumber }}</strong></td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="color: #888;">Payment date</td><td align="right">{{ optional($payment->paid_at)->format('d M Y, h:i A') }}</td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="color: #888;">Description</td><td align="right">Membership Renewal - 3 Months</td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="color: #888;">Payment method</td><td align="right">PayPal</td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="color: #888;">Currency</td><td align="right">{{ $payment->currency }}</td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="color: #888;">PayPal capture ID</td><td align="right">{{ $payment->capture_id }}</td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="color: #888;">Membership valid until</td><td align="right"><strong>{{ optional($user->membership_expiry)->format('d M Y') }}</strong></td></tr>
      <tr><td style="color: #888;">Status</td><td align="right" style="color: #2e7d32;"><strong>PAID</strong></td></tr>
    </table>

    <p style="font-size: 13px; color: #888; margin-top: 20px;">This email confirms the membership renewal payment recorded by ACG Store. Please keep it for your records.</p>
  </div>
</body>
</html>
