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
        try {
            $sbc = new SandblockChain();
            $remoteAcc = $sbc->getAccount(strtolower($address));

            // If we had an error while running the query
            if (isset($remoteAcc['error'])) {
                throw new \Exception('Impossible to find the given account', 404);
            }

            // Account has no existence inside the chain, we return empty object
            if (!isset($remoteAcc['value']['address']) || strlen($remoteAcc['value']['address']) <= 0) {
                $retn = [
                    "address" => $address,
                    "coins" => [],
                    "public_key_type" => "",
                    "public_key_value" => "",
                    "account_number" => 0,
                    "sequence" => 0
                ];
                return parent::apiAnswer(200, $retn, "Account does not exists");
            }

            $acc = Account::where(['address' => strtolower($address)])->with(['transactionsSent', 'transactionsReceived']);

            // Account does not exists atm
            if (!$acc->exists()) {
                $acc = Account::create([
                    "address" => strtolower($address),
                    "coins" => json_encode($remoteAcc['value']['coins']),
                    "public_key_type" => $remoteAcc['value']['public_key']['type'],
                    "public_key_value" => $remoteAcc['value']['public_key']['value'],
                    "account_number" => $remoteAcc['value']['account_number'],
                    "sequence" => $remoteAcc['value']['sequence']
                ]);
            } // Account exists we sync everything up
            else {
                $acc = $acc->first();
                $acc->coins = json_encode($remoteAcc['value']['coins']);
                $acc->sequence = $remoteAcc['value']['sequence'];
                $acc->save();
            }

            return parent::apiAnswer(200, $acc, "");
        } catch(\Exception $e) {
            return parent::apiAnswer(($e->getCode() != NULL) ? $e->getCode() : 500, ['error' => $e->getMessage()]);
        }
    }
}
