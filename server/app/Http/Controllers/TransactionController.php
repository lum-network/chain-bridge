<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function __construct()
    {
    }

    public function index(Request $req)
    {
        try {
            $transactions = Transaction::latest()->take(50)->get();

            return parent::apiAnswer(200, $transactions, "");
        } catch (\Exception $e){
            return parent::apiAnswer(($e->getCode() != NULL) ? $e->getCode() : 500, ['error' => $e->getMessage()]);
        }
    }

    public function show(Request $req, $hash)
    {
        try {
            $transaction = Transaction::where(['hash'=>strtoupper($hash)]);
            if(!$transaction->exists()){
                return parent::apiAnswer(404, [], "No transaction with that hash");
            }

            return parent::apiAnswer(200, $transaction->first(), "");
        } catch (\Exception $e){
            return parent::apiAnswer(($e->getCode() != NULL) ? $e->getCode() : 500, ['error' => $e->getMessage()]);
        }
    }
}
