<?php

namespace App\Http\Controllers;

use App\Models\SatMigration;
use Illuminate\Http\Request;
use App\Libraries\Ethereum;
use Illuminate\Support\Str;
use Bezhanov\Ethereum\Converter;

class MigrationController extends Controller
{
    public function __construct()
    {
    }

    public function store(Request $req)
    {
        try {
            $req->validate([
                'address'   =>  'string|required',
                'msg'       =>  'string|required',
                'sig'       =>  'string|required',
                'version'   =>  'string|required'
            ]);

            if(SatMigration::where(['from_address'=>$req->input('address'), 'state'=>'WAITING'])->exists()){
                throw new \Exception('That account already have a pending migration request', 400);
            }

            $eth = new Ethereum(false);
            $verify = $eth->personal_ecRecover($req->input('msg'), $req->input('sig'));
            if($verify != $req->input('address')){
                throw new \Exception("We weren't able to verify your message. Please try again", 403);
            }

            $msg = json_decode(hex2bin($req->input('msg')), true);
            $toAddress = $msg['destination'];
            $balance = $eth->getSATBalanceForAddress($verify);
            if($balance['status'] != 1 || $balance['message'] != 'OK'){
                throw new \Exception('Error while trying to fetch the account balance', 500);
            }

            if($balance['result'] <= 0){
                throw new \Exception("You don't have any Sandblock SAT", 400);
            }

            $converter = new Converter();
            $amount = explode('.', $converter->fromWei($balance['result'], 'ether'))[0];

            $payload = [
                'reference'     =>  Str::random(36),
                'state'         =>  'WAITING',
                'from_address'  =>  $verify,
                'to_address'    =>  $toAddress,
                'amount'        =>  $amount
            ];

            $migration = SatMigration::create($payload);

            return parent::apiAnswer(200, $migration, "");
        } catch(\Exception $e){
            return parent::apiAnswer(($e->getCode() != NULL) ? $e->getCode() : 500, ['error' => $e->getMessage()]);
        }
    }

    public function show(Request $req, $reference)
    {
        try
        {
            $migration = SatMigration::where(['reference'=>$reference]);
            if(!$migration->exists()){
                throw new \Exception('Given migration does not exists', 404);
            }

            $migration = $migration->first();
            return parent::apiAnswer(200, $migration, "");
        } catch (\Exception $e){
            return parent::apiAnswer(($e->getCode() != NULL) ? $e->getCode() : 500, ['error' => $e->getMessage()]);
        }
    }
}
