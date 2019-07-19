<?php

namespace App\Http\Controllers;

use App\Models\Block;
use Illuminate\Http\Request;

class BlockController extends Controller
{
    public function __construct()
    {
    }

    public function index()
    {
        $blocks = Block::latest()->take(50)->orderBy('height', 'desc')->get();

        return parent::apiAnswer(200, $blocks, "");
    }

    public function show(Request $req, $height)
    {
        $block = Block::where(['height'=>$height]);
        if(!$block->exists()){
            return parent::apiAnswer(404, [], "No block with that height");
        }

        $block = $block->first();
        return parent::apiAnswer(200, $block, "");
    }
}
