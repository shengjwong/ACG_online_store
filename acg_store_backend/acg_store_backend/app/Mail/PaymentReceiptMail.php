<?php

namespace App\Mail;

use App\Models\Payment;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class PaymentReceiptMail extends Mailable
{
    public function __construct(public Payment $payment)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Payment received - Order ' . $this->payment->order->order_number,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.payment-receipt');
    }
}
