<?php

namespace App\Http\Controllers;

use App\Libraries\SandblockChain;
use Illuminate\Http\Request;

class ValidatorController extends Controller
{
    public function index(Request $req)
    {
        try {
            $sbc = new SandblockChain();
            $validators = $sbc->getValidators();

            return parent::apiAnswer(200, $validators);
        } catch(\Exception $e){
            return parent::apiAnswer(($e->getCode() != NULL) ? $e->getCode() : 500, ['error' => $e->getMessage()]);
        }
    }

    public function show(Request $req, $address)
    {
        try {
            $sbc = new SandblockChain();
            $validator = $sbc->getValidator(strtolower($address));
            $validator['delegations'] = $sbc->getValidatorDelegations($address);

            return parent::apiAnswer(200, $validator);
        } catch(\Exception $e) {
            return parent::apiAnswer(($e->getCode() != NULL) ? $e->getCode() : 500, ['error' => $e->getMessage()]);
        }
    }
}
