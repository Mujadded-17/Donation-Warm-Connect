<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class DonationApprovedMail extends Mailable
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
        return $this->subject('Your donation has been approved 🎉')
            ->view('emails.donation_approved');
    }
}