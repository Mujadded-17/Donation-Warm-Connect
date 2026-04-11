<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class DonationRejectedMail extends Mailable
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
        return $this->subject('Your donation was not approved')
            ->view('emails.donation_rejected');
    }
}