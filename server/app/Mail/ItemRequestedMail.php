<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ItemRequestedMail extends Mailable
{
    use SerializesModels;

    public $donor;
    public $item;
    public $receiver;

    public function __construct($donor, $item, $receiver)
    {
        $this->donor = $donor;
        $this->item = $item;
        $this->receiver = $receiver;
    }

    public function build()
    {
        return $this->subject('Your item has a new request')
            ->view('emails.item_requested');
    }
}