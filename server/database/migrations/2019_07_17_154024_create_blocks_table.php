<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateBlocksTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('blocks', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->string("chain_id")->default("sandblockchain");

            $table->string("hash")->unique();
            $table->bigInteger("height");

            $table->timestamp("dispatched_at")->nullable();

            $table->integer("num_txs");
            $table->integer("total_txs");

            $table->longText("raw");

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('blocks');
    }
}
