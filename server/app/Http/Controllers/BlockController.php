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
        try {
            $blocks = Block::latest()->take(50)->orderBy('height', 'desc')->get();

            return parent::apiAnswer(200, $blocks, "");
        } catch(\Exception $e){
            return parent::apiAnswer(($e->getCode() != NULL) ? $e->getCode() : 500, ['error' => $e->getMessage()]);
        }
    }

    public function show(Request $req, $height)
    {
        try {
            $block = Block::where(['height' => $height])->with(['transactions']);
            if (!$block->exists()) {
                return parent::apiAnswer(404, [], "No block with that height");
            }

            $block = $block->first();
            return parent::apiAnswer(200, $block, "");
        } catch(\Exception $e){
            return parent::apiAnswer(($e->getCode() != NULL) ? $e->getCode() : 500, ['error' => $e->getMessage()]);
        }
    }

    public function latest(Request $req)
    {
        try {
            $block = Block::latest()->first();
            return parent::apiAnswer(200, $block, "");
        } catch(\Exception $e){
            return parent::apiAnswer(($e->getCode() != NULL) ? $e->getCode() : 500, ['error' => $e->getMessage()]);
        }
    }
}
