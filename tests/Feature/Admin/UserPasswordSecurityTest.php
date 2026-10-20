<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserPasswordSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_cannot_create_an_account_with_a_weak_password(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.users.store'), [
            'name' => 'New Admin',
            'email' => 'new-admin@example.com',
            'password' => 'admin123',
            'role' => 'admin',
        ]);

        $response->assertSessionHasErrors('password');
        $this->assertDatabaseMissing('users', ['email' => 'new-admin@example.com']);
    }

    public function test_admin_cannot_update_an_account_to_a_weak_password(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $target = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->put(route('admin.users.update', $target), [
            'name' => $target->name,
            'email' => $target->email,
            'password' => 'admin123',
            'role' => 'admin',
        ]);

        $response->assertSessionHasErrors('password');
    }

    public function test_admin_can_create_a_student_with_a_simple_six_character_password(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.users.store'), [
            'name' => 'New Student',
            'email' => 'new-student@example.com',
            'password' => 'simple',
            'role' => 'student',
        ]);

        $response->assertRedirect(route('admin.users.index'));

        $student = User::where('email', 'new-student@example.com')->firstOrFail();
        $this->assertTrue($student->isStudent());
        $this->assertTrue(Hash::check('simple', $student->password));
    }

    public function test_admin_student_management_accepts_a_simple_six_character_password(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.students.store'), [
            'name' => 'New Student',
            'email' => 'another-student@example.com',
            'password' => 'simple',
            'class' => '10A',
        ]);

        $response->assertRedirect(route('admin.students.index'));

        $student = User::where('email', 'another-student@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('simple', $student->password));
    }

    public function test_admin_can_update_a_student_to_a_simple_six_character_password(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($admin)->put(route('admin.students.update', $student), [
            'name' => $student->name,
            'email' => $student->email,
            'class' => '10A',
            'password' => 'simple',
        ]);

        $response->assertRedirect(route('admin.students.index'));
        $this->assertTrue(Hash::check('simple', $student->refresh()->password));
    }
}
