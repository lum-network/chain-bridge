<?php

namespace App\Http\Controllers;

use App\Models\Block;
use App\Models\Transaction;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __construct()
    {

    }

    public function search(Request $req)
    {
        $req->validate([
            'data'      =>  'string|required'
        ]);

        $data = $req->input('data');

        // Is it a block height?
        if (is_numeric($data)){
            return parent::apiAnswer(200, ["type"=>"block", "data"=>$data], "");
        }
        // Is it an address ?
        else if (strpos($data, "surprise") === 0){
            return parent::apiAnswer(200, ["type"=>"account", "data"=>$data], "");
        }
        else {
            // Is it a block hash ?
            $block = Block::where(['hash'=>$data]);
            if($block->exists()){
                return parent::apiAnswer(200, ["type"=>"block", "data"=>$block->first()->height]);
            }
            // Is it a tx hash ?
            else if(Transaction::where(['hash'=>$data])->exists()){
                return parent::apiAnswer(200, ["type"=>"transaction", "data"=>$data]);
            }
            else {
                return parent::apiAnswer(404, ["data"=>$data], "Unable to find any data associated");
            }
        }

    }
}
