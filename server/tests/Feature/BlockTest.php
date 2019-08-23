<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Foundation\Testing\RefreshDatabase;

class BlockTest extends TestCase
{
    public function testLastFifty()
    {
        $response = $this->get('/api/v1/blocks');

        $response->assertStatus(200);
        $response->assertJsonCount(50, 'result');
    }

    public function testAtHeight()
    {
        // First we get list
        $response = $this->get('/api/v1/blocks');
        $response->assertStatus(200);

        // Then we pick a random one
        $blocks = json_decode($response->getContent(), true)['result'];
        $block = $blocks[array_rand($blocks)];

        // Then we request it
        $response = $this->get('/api/v1/blocks/'.$block['height']);

        $response->assertStatus(200);
        $response->assertJson(['result' => [
            'id'        =>  $block['height'],
            'height'    =>  $block['height'],
            'chain_id'  =>  'sandblockchain'
        ], 'code'=>200]);
        $response->assertJsonStructure(['result'=>[
            'id',
            'chain_id',
            'hash',
            'dispatched_at',
            'num_txs',
            'total_txs',
            'created_at',
            'updated_at',
            'proposer_address'
        ], 'message', 'code']);
    }

    public function testLatest()
    {
        $response = $this->get('/api/v1/blocks/latest');
        $response->assertStatus(200);
        $response->assertJsonStructure(['result'=>[
            'id',
            'chain_id',
            'hash',
            'dispatched_at',
            'num_txs',
            'total_txs',
            'created_at',
            'updated_at',
            'proposer_address'
        ], 'message', 'code']);
    }

    public function testBadHeight()
    {
        $response = $this->get('/api/v1/blocks/coucou');

        $response->assertStatus(404);
    }
}
