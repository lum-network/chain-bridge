<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    protected $table = "accounts";

    protected $fillable = [
        "address", "coins",
        "public_key_type", "public_key_value",
        "account_number", "sequence"
    ];

    protected $with = [];

    protected $hidden = [];
}
