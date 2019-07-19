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
        $transactions = Transaction::latest()->take(50)->get();

        return parent::apiAnswer(200, $transactions, "");
    }

    public function show(Request $req, $hash)
    {
        $transaction = Transaction::where(['hash'=>strtoupper($hash)]);
        if(!$transaction->exists()){
            return parent::apiAnswer(404, [], "No transaction with that hash");
        }

        return parent::apiAnswer(200, $transaction->first(), "");
    }
}
