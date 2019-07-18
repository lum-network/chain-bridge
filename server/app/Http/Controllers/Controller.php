<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;

    public static function apiAnswer($code, $result, $message = "")
    {
        $status_code = array("100","101","200","201","202","203","204","205","206","300","301","302","303","304","305","306","307","400","401","402","403","404","405","406","407","408","409","410","411","412","413","414","415","416","417","500","501","502","503","504","505");
        if (in_array($code, $status_code)) {
            $code = ($code != "") ? $code : 500;
        } else {
            $code = 500;
        }
        $retn = ["result"=>$result, "message"=>$message, "code"=>$code];
        return (response()->json($retn, $code));
    }
}
