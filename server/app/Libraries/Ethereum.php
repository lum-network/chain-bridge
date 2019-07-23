<?php
namespace App\Libraries;

use App\Libraries\CryptoCurrencyPHP\PointMathGMP;
use App\Libraries\CryptoCurrencyPHP\SECp256k1;
use App\Libraries\CryptoCurrencyPHP\Signature;
use GuzzleHttp\Client as HttpClient;
use kornrunner\Keccak;

class Ethereum
{
    private $client;

    public function __construct($testnet = false)
    {
        $this->client = new HttpClient([
            'base_uri' => ($testnet) ? 'https://api-ropsten.etherscan.io' : 'https://api.etherscan.io',
            "http_errors" => true,
        ]);
    }

    public function getTransactionsForAccount($address)
    {
        $res = $this->client->get('api', [
            'query' => [
                'module'    =>  'account',
                'action'    =>  'tokentx',
                'address'   =>  $address,
                'startblock'=>  0,
                'endblock'  =>  999999999,
                'sort'      =>  'asc',
                'apikey'    =>  'F2F78MMA8F45WWDWWN8BFPA4MDJ5CV6VQY'
            ]
        ]);
        return json_decode($res->getBody(), true);
    }

    public function getSATBalanceForAddress($address)
    {
        $res = $this->client->get('api', [
            'query' => [
                'module'            =>  'account',
                'action'            =>  'tokenbalance',
                'address'           =>  $address,
                'contractaddress'   =>  '0x92736b3bff1bbd72a72478d78f18a6ab9b68b791',
                'apikey'            =>  'F2F78MMA8F45WWDWWN8BFPA4MDJ5CV6VQY'
            ]
        ]);
        return json_decode($res->getBody(), true);
    }

    function personal_ecRecover($msg, $signed) {
        $personal_prefix_msg = "\x19Ethereum Signed Message:\n". strlen($msg). $msg;
        $hex = $this->keccak256($personal_prefix_msg);
        return $this->ecRecover($hex, $signed);
    }

    public function ecRecover($hex, $signed) {
        $rHex   = substr($signed, 2, 64);
        $sHex   = substr($signed, 66, 64);
        $vValue = hexdec(substr($signed, 130, 2));
        $messageHex       = substr($hex, 2);
        $messageByteArray = unpack('C*', hex2bin($messageHex));
        $messageGmp       = gmp_init("0x" . $messageHex);
        $r = $rHex;		//hex string without 0x
        $s = $sHex; 	//hex string without 0x
        $v = $vValue; 	//27 or 28
        //with hex2bin it gives the same byte array as the javascript
        $rByteArray = unpack('C*', hex2bin($r));
        $sByteArray = unpack('C*', hex2bin($s));
        $rGmp = gmp_init("0x" . $r);
        $sGmp = gmp_init("0x" . $s);
        $recovery = $v - 27;
        if ($recovery !== 0 && $recovery !== 1) {
            throw new \Exception('Invalid signature v value');
        }
        $publicKey = Signature::recoverPublicKey($rGmp, $sGmp, $messageGmp, $recovery);
        $publicKeyString = $publicKey["x"] . $publicKey["y"];
        return '0x'. substr($this->keccak256(hex2bin($publicKeyString)), -40);
    }

    private function strToHex($string)
    {
        $hex = unpack('H*', $string);
        return '0x' . array_shift($hex);
    }

    private function keccak256($str) {
        return '0x'. Keccak::hash($str, 256);
    }
}