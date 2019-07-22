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

        // If we had an error while running the query
        if(isset($remoteAcc['error'])){
            return parent::apiAnswer(500, [], $remoteAcc['error']);
        }

        // Account has no existence inside the chain, we return empty object
        if(!isset($remoteAcc['account']['value']['address']) || strlen($remoteAcc['account']['value']['address']) <= 0){
            $retn = [
                "address"           =>  "",
                "coins"             =>  [],
                "public_key_type"   =>  "",
                "public_key_value"  =>  "",
                "account_number"    =>  0,
                "sequence"          =>  0
            ];
            return parent::apiAnswer(200, $retn, "Account does not exists");
        }

        $acc = Account::where(['address'=>strtolower($address)])->with(['transactionsSent', 'transactionsReceived']);

        // Account does not exists atm
        if(!$acc->exists()){
            $acc = Account::create([
                "address"           =>  strtolower($address),
                "coins"             =>  json_encode($remoteAcc['account']['value']['coins']),
                "public_key_type"   =>  $remoteAcc['account']['value']['public_key']['type'],
                "public_key_value"  =>  $remoteAcc['account']['value']['public_key']['value'],
                "account_number"    =>  $remoteAcc['account']['value']['account_number'],
                "sequence"          =>  $remoteAcc['account']['value']['sequence']
            ]);
        }
        // Account exists we sync everything up
        else {
            $acc = $acc->first();
            $acc->coins = json_encode($remoteAcc['account']['value']['coins']);
            $acc->sequence = $remoteAcc['account']['value']['sequence'];
            $acc->save();
        }

        return parent::apiAnswer(200, $acc, "");
    }
}