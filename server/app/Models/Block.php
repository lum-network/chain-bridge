<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Block extends Model {
    protected $table = "blocks";

    protected $fillable = [
        "chain_id", "hash", "height", "dispatched_at",
        "num_txs", "total_txs", "proposer_address",
        "raw"
    ];

    protected $hidden = [];

    protected $with = [];

    public function transactions()
    {
        return self::hasMany(Transaction::class);
    }
}