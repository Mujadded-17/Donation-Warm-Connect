<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class DonationPendingMail extends Mailable
{
    use SerializesModels;

    public $user;
    public $item;

    public function __construct($user, $item)
    {
        $this->user = $user;
        $this->item = $item;
    }

    public function build()
    {
        return $this->subject('Thank you for your donation submission')
            ->view('emails.donation_pending');
    }
}