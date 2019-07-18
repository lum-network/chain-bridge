<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateTransactionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->bigInteger('height');
            $table->string('hash');

            $table->string('action')->nullable();

            $table->unsignedBigInteger('block_id')->nullable();
            $table->foreign('block_id')->references('id')->on('blocks')->onDelete('cascade')->onUpdate('cascade');

            $table->integer('code')->nullable();
            $table->boolean('success')->default(false);
            $table->json('log')->nullable();

            $table->bigInteger('gas_wanted')->default(0);
            $table->bigInteger('gas_used')->default(0);

            $table->string('from_address')->nullable();
            $table->string('to_address')->nullable();

            $table->string('name')->nullable();
            $table->string('amount')->nullable();

            $table->json('raw');

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
        Schema::dropIfExists('transactions');
    }
}
