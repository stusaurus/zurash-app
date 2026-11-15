import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('art_review', Path(__file__).parents[1] / 'scripts/house-art-review.py')
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)


class ArtReviewCoverage(unittest.TestCase):
    def records(self, widths=(320, 390)):
        return [dict(project=project, state=f'{width}-{state}')
                for project in ('chromium', 'webkit') for width in widths
                for state in review.EXPECTED_STATES]

    def test_both_viewports_and_browsers_have_full_coverage(self):
        counts, widths = review.validate_coverage(self.records())
        self.assertEqual(counts, {'chromium': 108, 'webkit': 108})
        self.assertEqual(widths['webkit'], {'320': 54, '390': 54})

    def test_missing_viewport_cannot_pass_with_54_images(self):
        with self.assertRaisesRegex(ValueError, 'viewport'):
            review.validate_coverage(self.records((390,)))

    def test_replacing_real_state_with_junk_cannot_pass_same_count(self):
        records = self.records()
        records[0]['state'] = '320-unknown-completed-object'
        with self.assertRaisesRegex(ValueError, '54 states'):
            review.validate_coverage(records)

    def test_legacy_gallery_stays_readable(self):
        records = [dict(project='chromium', state=state) for state in review.EXPECTED_STATES]
        counts, widths = review.validate_coverage(records)
        self.assertEqual(counts, {'chromium': 54})
        self.assertEqual(widths, {'chromium': {'390': 54}})

    def test_duplicate_or_empty_capture_is_rejected(self):
        records = self.records()
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            review.validate_coverage(records + [records[0]])
        with self.assertRaisesRegex(ValueError, 'No art'):
            review.validate_coverage([])


if __name__ == '__main__':
    unittest.main()
