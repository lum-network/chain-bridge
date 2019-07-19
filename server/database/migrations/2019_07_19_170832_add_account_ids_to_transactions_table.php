<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddAccountIdsToTransactionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->unsignedBigInteger('sender_id')->nullable()->after('raw');
            $table->foreign('sender_id')->references('id')->on('accounts')->onDelete('cascade')->onUpdate('cascade');

            $table->unsignedBigInteger('recipient_id')->nullable()->after('sender_id');
            $table->foreign('recipient_id')->references('id')->on('accounts')->onDelete('cascade')->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('sender_id');
            $table->dropColumn('recipient_id');
        });
    }
}
