<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_update_page_is_displayed()
    {
        $user = User::factory()->create(['role' => 'student']);

        $response = $this
            ->actingAs($user)
            ->get(route('user-password.edit'));

        $response->assertStatus(200);
    }

    public function test_password_can_be_updated()
    {
        $user = User::factory()->create(['role' => 'student']);

        $response = $this
            ->actingAs($user)
            ->from(route('user-password.edit'))
            ->put(route('user-password.update'), [
                'current_password' => 'password',
                'password' => 'simple',
                'password_confirmation' => 'simple',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('user-password.edit'));

        $this->assertTrue(Hash::check('simple', $user->refresh()->password));
    }

    public function test_correct_password_must_be_provided_to_update_password()
    {
        $user = User::factory()->create(['role' => 'student']);

        $response = $this
            ->actingAs($user)
            ->from(route('user-password.edit'))
            ->put(route('user-password.update'), [
                'current_password' => 'wrong-password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

        $response
            ->assertSessionHasErrors('current_password')
            ->assertRedirect(route('user-password.edit'));
    }

    public function test_admin_cannot_set_a_weak_password()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this
            ->actingAs($admin)
            ->from(route('user-password.edit'))
            ->put(route('user-password.update'), [
                'current_password' => 'password',
                'password' => 'admin123',
                'password_confirmation' => 'admin123',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect(route('user-password.edit'));
    }
}
