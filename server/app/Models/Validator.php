<?php

namespace App\Models;

use App\Traits\EloquentGetTableName;
use Illuminate\Database\Eloquent\Model;

class Validator extends Model
{
    use EloquentGetTableName;

    protected $table = "validators";

    protected $fillable = [
        "address_consensus", "address_consensus_pub",
        "address_operator", "address_operator_pub"
    ];

    protected $hidden = [];

    protected $with = [];
}
