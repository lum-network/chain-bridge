<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SatMigration extends Model
{
    protected $table = "sat_migrations";

    protected $fillable = [
        'reference', 'state', 'message',
        'from_address', 'to_address',
        'tx_hash', 'amount'
    ];

    public function to()
    {
        return self::belongsTo(Account::class, 'to_address', 'address');
    }
}
