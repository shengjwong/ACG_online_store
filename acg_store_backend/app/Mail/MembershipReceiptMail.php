<?php

namespace App\Mail;

use App\Models\MembershipPayment;
use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class MembershipReceiptMail extends Mailable
{
    public string $receiptNumber;

    public function __construct(public MembershipPayment $payment, public User $user)
    {
        // Same format the Payment History receipt used: ACG-MEM-000012
        $this->receiptNumber = 'ACG-MEM-' . str_pad((string) $payment->id, 6, '0', STR_PAD_LEFT);
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Membership payment receipt - ' . $this->receiptNumber);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.membership-receipt');
    }
}
