<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f4f4f7; padding: 24px; color: #222;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 12px; letter-spacing: 1px; color: #888;">
      <tr>
        <td><strong>ACG STORE</strong></td>
        <td align="right">REWARD REDEMPTION</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 22px 0 8px;">
      <div style="display: inline-block; width: 46px; height: 46px; line-height: 46px; border-radius: 50%; background: #6366f1; color: #fff; font-size: 22px;">&#9733;</div>
      <h2 style="margin: 12px 0 4px;">Reward redeemed!</h2>
      <p style="margin: 0; color: #555;">Hi {{ $user->name }}, your reward is now being prepared for shipping.</p>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <div style="font-size: 20px; font-weight: bold;">{{ optional($redemption->product)->name }}</div>
      <div style="font-size: 13px; color: #888; margin-top: 4px;">{{ number_format($redemption->points_spent) }} points used</div>
    </div>

    <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; font-size: 14px; border-top: 1px solid #eee;">
      <tr style="border-bottom: 1px solid #eee;"><td style="color: #888;">Redemption no.</td><td align="right"><strong>{{ $redemption->redemption_number }}</strong></td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="color: #888;">Date</td><td align="right">{{ optional($redemption->created_at)->format('d M Y, h:i A') }}</td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="color: #888;">Points used</td><td align="right">{{ number_format($redemption->points_spent) }} pts</td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="color: #888;">Points balance now</td><td align="right">{{ number_format($user->points_balance) }} pts</td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="color: #888;">Shipping fee</td><td align="right">Free</td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="color: #888;">Estimated delivery</td><td align="right">{{ optional($redemption->estimated_delivery_start)->format('d M Y') }} - {{ optional($redemption->estimated_delivery_end)->format('d M Y') }}</td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="color: #888; vertical-align: top;">Ship to</td><td align="right">{{ $redemption->shipping_address }}</td></tr>
      <tr><td style="color: #888;">Status</td><td align="right"><strong>Preparing</strong></td></tr>
    </table>

    <p style="font-size: 13px; color: #555; margin-top: 20px;">You can follow the delivery status any time under <strong>My Orders</strong> on ACG Store.</p>
    <p style="font-size: 12px; color: #888;">This is an automated email from ACG Store.</p>
  </div>
</body>
</html>
