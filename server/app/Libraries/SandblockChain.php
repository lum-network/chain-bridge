<?php

namespace App\Libraries;

use GuzzleHttp\Client as HttpClient;
use http\Exception;

class SandblockChain
{
    private $client;

    public function __construct()
    {
        $this->client = new HttpClient([
            'base_uri' => 'https://shore.sandblock.io/',
            "http_errors" => true,
        ]);
    }

    public function getStatus(){
        $res = $this->client->get('tendermint/status');
        return json_decode($res->getBody(), true)['result'];
    }

    public function getBlocks($minHeight, $maxHeight){
        $res = $this->client->get('tendermint/blockchain?minHeight='.$minHeight.'&maxHeight='.$maxHeight);
        return json_decode($res->getBody(), true)['result'];
    }
}