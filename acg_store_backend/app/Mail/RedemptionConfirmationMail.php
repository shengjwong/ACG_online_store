<?php

namespace App\Mail;

use App\Models\Redemption;
use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class RedemptionConfirmationMail extends Mailable
{
    public function __construct(public Redemption $redemption, public User $user)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Reward redeemed - ' . $this->redemption->redemption_number);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.redemption-confirmation');
    }
}
