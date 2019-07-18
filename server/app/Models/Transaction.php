<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $table = "transactions";

    protected $fillable = [
        "height", "action", "block_id",
        "code", "success", "log",
        "gas_wanted", "gas_used",
        "from_address", "to_address",
        "name", "amount",

        "raw"
    ];

    protected $hidden = [];

    protected $with = [];
}