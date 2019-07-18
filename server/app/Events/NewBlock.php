<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

use App\Models\Block;

class NewBlock implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    private $block;

    public function __construct(Block $block)
    {
        $this->block = $block;
    }

    public function broadcastOn()
    {
        return ['blocks'];
    }

    public function broadcastAs()
    {
        return 'new-block';
    }

    public function broadcastWith()
    {
        return $this->block->toArray();
    }
}
