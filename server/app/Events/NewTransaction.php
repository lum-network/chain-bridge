<?php

namespace App\Events;

use App\Models\Transaction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class NewTransaction implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    private $transaction;

    public function __construct(Transaction $tx)
    {
        $this->transaction = $tx;
    }

    public function broadcastOn()
    {
        return ['new-transactions'];
    }

    public function broadcastAs()
    {
        return 'new-transaction';
    }

    public function broadcastWith()
    {
        return $this->transaction->toArray();
    }
}
