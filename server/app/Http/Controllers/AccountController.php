<?php

namespace App\Http\Controllers;

use App\Libraries\SandblockChain;
use App\Models\Account;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function __construct()
    {
    }

    public function show(Request $req, $address)
    {
        $sbc = new SandblockChain();
        $remoteAcc = $sbc->getAccount(strtolower($address));

        $acc = Account::where(['address'=>strtolower($address)]);
        if(!$acc->exists()){
            $acc = Account::create([
                "address"           =>  strtolower($address),
                "coins"             =>  json_encode($remoteAcc['account']['value']['coins']),
                "public_key_type"   =>  $remoteAcc['account']['value']['public_key']['type'],
                "public_key_value"  =>  $remoteAcc['account']['value']['public_key']['value'],
                "account_number"    =>  $remoteAcc['account']['value']['account_number'],
                "sequence"          =>  $remoteAcc['account']['value']['sequence']
            ]);
        } else {
            $acc = $acc->first();
            $acc->coins = json_encode($remoteAcc['account']['value']['coins']);
            $acc->sequence = $remoteAcc['account']['value']['sequence'];
            $acc->save();
        }

        return parent::apiAnswer(200, $acc, "");
    }
}
