<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f4f4f7; padding: 24px; color: #222;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 28px;">
    <h2 style="margin-top: 0;">Thank you for your payment, {{ $payment->order->user->name }}!</h2>
    <p>We have received your PayPal payment for order <strong>{{ $payment->order->order_number }}</strong>.</p>

    <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse: collapse; margin: 16px 0;">
      @foreach ($payment->order->items as $item)
        <tr style="border-bottom: 1px solid #eee;">
          <td>{{ $item->product_name }} x {{ $item->quantity }}</td>
          <td align="right">RM {{ number_format($item->subtotal, 2) }}</td>
        </tr>
      @endforeach
      <tr>
        <td>Shipping</td>
        <td align="right">RM {{ number_format($payment->order->shipping_fee, 2) }}</td>
      </tr>
      <tr>
        <td><strong>Total paid</strong></td>
        <td align="right"><strong>RM {{ number_format($payment->amount, 2) }}</strong></td>
      </tr>
    </table>

    <p style="font-size: 14px; color: #555;">
      Payment method: PayPal<br>
      Transaction ID: {{ $payment->transaction_id }}<br>
      Date: {{ optional($payment->paid_at)->format('d M Y, h:i A') }}<br>
      Shipping address: {{ $payment->order->shipping_address }}
    </p>

    <p style="font-size: 13px; color: #888;">This is an automated email from ACG Store.</p>
  </div>
</body>
</html>
