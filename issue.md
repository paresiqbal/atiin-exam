# Issue: Restore question images in exam result PDFs

## Scope and rules

This issue has two separate parts:

1. Fix question and option images in generated student exam result PDFs.
2. Investigate images that intermittently fail to appear during an exam. This part is investigation only; do not change code until the cause is confirmed.

Keep the PDF fix small. Only edit:

- `app/Services/ExamResultsPdfService.php`
- `resources/views/pdfs/exam-results.blade.php`

Do not change the database, exam pages, or editor. A missing, invalid, or unreachable image must not prevent the rest of the PDF from generating.

## Problem 1: Images missing from student exam result PDFs

Question HTML may contain `<img src="...">` markup saved by the Tiptap editor. DomPDF does not reliably load relative or remote image URLs by default. Additionally, the current PDF template does not print images belonging to question options.

### Implementation steps

1. In `ExamResultsPdfService`, add a private `toDataUri(?string $src): ?string` helper.
   - Return `null` for an empty source.
   - Return the source unchanged if it is already a `data:` URI.
   - For an image under `/storage/`, resolve its path under `storage/app/public/`, verify the file exists, then read it and return a Base64 data URI using its MIME type.
   - For an absolute `http` or `https` URL, fetch it with Laravel's HTTP client and a short timeout (8 seconds). Return a data URI only for a successful response; use the response `Content-Type`, falling back to `image/png`.
   - Return `null` for unsupported URL forms or failed requests. Catch image-specific failures so a broken image cannot interrupt PDF generation.
   - Follow the supplied approach, but check the return values from file reads and MIME detection so invalid files also resolve to `null` rather than producing an invalid data URI.

   Suggested implementation:

   ```php
   private function toDataUri(?string $src): ?string
   {
       if (!$src) {
           return null;
       }

       if (str_starts_with($src, 'data:')) {
           return $src;
       }

       $path = parse_url($src, PHP_URL_PATH) ?: '';

       if (str_starts_with($path, '/storage/')) {
           $local = storage_path('app/public/'.substr($path, strlen('/storage/')));

           if (is_file($local)) {
               return 'data:'.mime_content_type($local).';base64,'.base64_encode(file_get_contents($local));
           }
       }

       if (!preg_match('#^https?://#i', $src)) {
           return null;
       }

       try {
           $response = \Illuminate\Support\Facades\Http::timeout(8)->get($src);

           if (!$response->successful()) {
               return null;
           }

           return 'data:'.($response->header('Content-Type') ?: 'image/png').';base64,'.base64_encode($response->body());
       } catch (\Throwable $exception) {
           return null;
       }
   }
   ```

2. Add a private `inlineHtmlImages(?string $html): string` helper in the same service.
   - Return an empty string for `null` HTML and return HTML unchanged if it contains no image tag.
   - Find each `<img>` tag with a quoted `src`, convert its source using `toDataUri()`, and replace the source with the data URI.
   - Remove just the `<img>` tag when its source cannot be converted. Preserve all other question/answer HTML.

   Suggested implementation:

   ```php
   private function inlineHtmlImages(?string $html): string
   {
       if (!$html || stripos($html, '<img') === false) {
           return $html ?? '';
       }

       return preg_replace_callback('/<img\b[^>]*\bsrc=["\']([^"\']+)["\'][^>]*>/i', function ($match) {
           $data = $this->toDataUri($match[1]);

           return $data ? str_replace($match[1], $data, $match[0]) : '';
       }, $html);
   }
   ```

   Ensure the helper consistently returns a string if the regular-expression replacement fails.

3. Update the question mapping inside `generate()` to inline images in the question and option HTML, and convert standalone question/option image URLs:

   ```php
   'question_text' => $this->inlineHtmlImages($question->question_text),
   'student_answer' => $this->inlineHtmlImages($response?->selectedOption?->option_text),
   'correct_answer' => $this->inlineHtmlImages($correctOption?->option_text),
   'image_data' => $this->toDataUri($question->image_url),
   'student_answer_img' => $this->toDataUri($response?->selectedOption?->image_url),
   'correct_answer_img' => $this->toDataUri($correctOption?->image_url),
   ```

   Replace the existing raw `image_url` mapping with `image_data` if it is no longer needed. Keep the existing score, answer, and correctness behavior unchanged.

4. In the Blade template's `<style>` block, add image sizing so images fit the question and answer boxes:

   ```css
   .question-item img,
   .answer-row img {
       max-width: 100%;
       max-height: 260px;
       height: auto;
   }
   ```

5. In the question markup, print each standalone data URI in the appropriate place:
   - Under the question text, render `question['image_data']` if it is not empty.
   - After the student answer text, render `question['student_answer_img']` if it is not empty.
   - After the correct answer text, render `question['correct_answer_img']` if it is not empty.
   - Use escaped Blade attribute output, for example:

     ```blade
     @if (!empty($question['image_data']))
         <img src="{{ $question['image_data'] }}">
     @endif
     ```

   - Keep the existing rule that the correct-answer row appears only for an incorrect student answer.

### Verification

1. Run the relevant existing automated tests, if available, and confirm the service/template still render when image fields are empty.
2. Download a result PDF for a student attempt that includes:
   - An image embedded in `question_text`.
   - A question-level `image_url`.
   - An image on the selected option.
   - An image on the correct option for a question the student answered incorrectly.
3. Confirm all available images appear at a reasonable size and a missing or broken image does not stop the PDF from generating.

## Problem 2: Images sometimes fail to appear during the exam

The cause is not known. Investigate only; do not change application code as part of this issue.

### Investigation steps

1. Identify one question reported as broken. Copy its `<img src="...">` value from `question_text` and record:
   - Whether the URL is relative or absolute.
   - Whether it uses `http` or `https`.
   - Which domain it points to.
2. On production, check that `APP_URL` in `.env` matches the real site URL, including `https` when applicable. Do not include secrets in the issue comment.
3. Check that the public storage link created by `php artisan storage:link` is present, and verify the referenced image exists under `storage/app/public`.
4. Check the uploaded image file sizes. Note whether files larger than approximately 1–2 MB correlate with the reported failures.
5. Confirm that `question_text` uses a `text` column and check whether any affected question contains an unusually long Base64 image.
6. Add the evidence and findings as a comment on this issue. Do not implement a proposed upload/image-processing fix here; create a later issue once the cause is confirmed.

## Done when

- Question images and option images appear in student exam result PDFs.
- A missing or broken image does not prevent the PDF from generating.
- Findings for the intermittent in-exam image issue are recorded in an issue comment.
