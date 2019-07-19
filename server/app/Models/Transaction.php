<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $table = "transactions";

    protected $fillable = [
        "height", "hash", "action", "block_id",
        "code", "success", "log",
        "gas_wanted", "gas_used",
        "from_address", "to_address",
        "name", "amount",
        "raw", "dispatched_at",
    ];

    protected $hidden = [];

    protected $with = [];

    public function block()
    {
        return self::belongsTo(Block::class, 'height');
    }
}