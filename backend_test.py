import requests
import sys
import json
import os
from datetime import datetime
from supabase import create_client, Client

class TextGrowAPITester:
    def __init__(self, base_url="https://91a36058-c40b-4267-a78a-bbae73b49e3d.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'  # Will be updated with real token
        }
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = {
            'shortcuts': [],
            'folders': [],
            'tags': []
        }
        self.supabase_client = None
        self.auth_token = None

    def run_test(self, name, method, endpoint, expected_status, data=None, check_response=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=self.headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=self.headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=self.headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=self.headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Parse response if JSON
                try:
                    response_data = response.json()
                    if check_response and callable(check_response):
                        check_result = check_response(response_data)
                        if not check_result:
                            print(f"⚠️  Response validation failed")
                            success = False
                            self.tests_passed -= 1
                    return success, response_data
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_endpoints(self):
        """Test health and root endpoints"""
        print("\n" + "="*50)
        print("TESTING HEALTH ENDPOINTS")
        print("="*50)
        
        # Test root endpoint
        self.run_test("Root Endpoint", "GET", "", 200)
        
        # Test health endpoint
        success, response = self.run_test(
            "Health Check", 
            "GET", 
            "health", 
            200,
            check_response=lambda r: 'status' in r and r['status'] == 'healthy'
        )
        
        return success

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n" + "="*50)
        print("TESTING AUTH ENDPOINTS")
        print("="*50)
        
        # Test get current user profile
        success, response = self.run_test(
            "Get Current User Profile",
            "GET",
            "auth/me",
            200,
            check_response=lambda r: 'id' in r and 'email' in r
        )
        
        return success

    def test_shortcut_endpoints(self):
        """Test shortcut CRUD operations"""
        print("\n" + "="*50)
        print("TESTING SHORTCUT ENDPOINTS")
        print("="*50)
        
        # Test get shortcuts (initially empty)
        success, shortcuts = self.run_test(
            "Get Shortcuts (Empty)",
            "GET",
            "shortcuts",
            200,
            check_response=lambda r: isinstance(r, list)
        )
        
        if not success:
            return False
        
        # Test create shortcut
        shortcut_data = {
            "trigger": "@test",
            "content": "This is a test shortcut content"
        }
        
        success, created_shortcut = self.run_test(
            "Create Shortcut",
            "POST",
            "shortcuts",
            200,
            data=shortcut_data,
            check_response=lambda r: 'id' in r and r['trigger'] == '@test'
        )
        
        if not success:
            return False
        
        shortcut_id = created_shortcut.get('id')
        if shortcut_id:
            self.created_resources['shortcuts'].append(shortcut_id)
        
        # Test get shortcuts (should have one now)
        success, shortcuts = self.run_test(
            "Get Shortcuts (With Data)",
            "GET",
            "shortcuts",
            200,
            check_response=lambda r: isinstance(r, list) and len(r) >= 1
        )
        
        if not success:
            return False
        
        # Test update shortcut
        if shortcut_id:
            update_data = {
                "trigger": "@updated",
                "content": "Updated content"
            }
            
            success, updated_shortcut = self.run_test(
                "Update Shortcut",
                "PUT",
                f"shortcuts/{shortcut_id}",
                200,
                data=update_data,
                check_response=lambda r: r.get('trigger') == '@updated'
            )
            
            if not success:
                return False
        
        # Test search shortcuts
        success, search_results = self.run_test(
            "Search Shortcuts",
            "GET",
            "search?q=updated",
            200,
            check_response=lambda r: isinstance(r, list)
        )
        
        return success

    def test_folder_endpoints(self):
        """Test folder CRUD operations"""
        print("\n" + "="*50)
        print("TESTING FOLDER ENDPOINTS")
        print("="*50)
        
        # Test get folders (initially empty)
        success, folders = self.run_test(
            "Get Folders (Empty)",
            "GET",
            "folders",
            200,
            check_response=lambda r: isinstance(r, list)
        )
        
        if not success:
            return False
        
        # Test create folder
        folder_data = {
            "name": "Test Folder"
        }
        
        success, created_folder = self.run_test(
            "Create Folder",
            "POST",
            "folders",
            200,
            data=folder_data,
            check_response=lambda r: 'id' in r and r['name'] == 'Test Folder'
        )
        
        if not success:
            return False
        
        folder_id = created_folder.get('id')
        if folder_id:
            self.created_resources['folders'].append(folder_id)
        
        # Test get folders (should have one now)
        success, folders = self.run_test(
            "Get Folders (With Data)",
            "GET",
            "folders",
            200,
            check_response=lambda r: isinstance(r, list) and len(r) >= 1
        )
        
        if not success:
            return False
        
        # Test update folder
        if folder_id:
            update_data = {
                "name": "Updated Folder"
            }
            
            success, updated_folder = self.run_test(
                "Update Folder",
                "PUT",
                f"folders/{folder_id}",
                200,
                data=update_data,
                check_response=lambda r: r.get('name') == 'Updated Folder'
            )
            
            if not success:
                return False
        
        return success

    def test_tag_endpoints(self):
        """Test tag CRUD operations"""
        print("\n" + "="*50)
        print("TESTING TAG ENDPOINTS")
        print("="*50)
        
        # Test get tags (initially empty)
        success, tags = self.run_test(
            "Get Tags (Empty)",
            "GET",
            "tags",
            200,
            check_response=lambda r: isinstance(r, list)
        )
        
        if not success:
            return False
        
        # Test create tag
        tag_data = {
            "name": "test-tag"
        }
        
        success, created_tag = self.run_test(
            "Create Tag",
            "POST",
            "tags",
            200,
            data=tag_data,
            check_response=lambda r: 'id' in r and r['name'] == 'test-tag'
        )
        
        if not success:
            return False
        
        tag_id = created_tag.get('id')
        if tag_id:
            self.created_resources['tags'].append(tag_id)
        
        # Test get tags (should have one now)
        success, tags = self.run_test(
            "Get Tags (With Data)",
            "GET",
            "tags",
            200,
            check_response=lambda r: isinstance(r, list) and len(r) >= 1
        )
        
        if not success:
            return False
        
        # Test update tag
        if tag_id:
            update_data = {
                "name": "updated-tag"
            }
            
            success, updated_tag = self.run_test(
                "Update Tag",
                "PUT",
                f"tags/{tag_id}",
                200,
                data=update_data,
                check_response=lambda r: r.get('name') == 'updated-tag'
            )
            
            if not success:
                return False
        
        return success

    def test_export_import(self):
        """Test export/import functionality"""
        print("\n" + "="*50)
        print("TESTING EXPORT/IMPORT")
        print("="*50)
        
        # Test export
        success, export_data = self.run_test(
            "Export Data",
            "GET",
            "export",
            200,
            check_response=lambda r: 'version' in r and 'shortcuts' in r
        )
        
        if not success:
            return False
        
        # Test import (using the exported data)
        success, import_result = self.run_test(
            "Import Data",
            "POST",
            "import",
            200,
            data=export_data,
            check_response=lambda r: 'imported_count' in r
        )
        
        return success

    def cleanup_resources(self):
        """Clean up created test resources"""
        print("\n" + "="*50)
        print("CLEANING UP TEST RESOURCES")
        print("="*50)
        
        # Delete shortcuts
        for shortcut_id in self.created_resources['shortcuts']:
            self.run_test(
                f"Delete Shortcut {shortcut_id[:8]}...",
                "DELETE",
                f"shortcuts/{shortcut_id}",
                200
            )
        
        # Delete folders
        for folder_id in self.created_resources['folders']:
            self.run_test(
                f"Delete Folder {folder_id[:8]}...",
                "DELETE",
                f"folders/{folder_id}",
                200
            )
        
        # Delete tags
        for tag_id in self.created_resources['tags']:
            self.run_test(
                f"Delete Tag {tag_id[:8]}...",
                "DELETE",
                f"tags/{tag_id}",
                200
            )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting TextGrow API Tests")
        print(f"Base URL: {self.base_url}")
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            # Test health endpoints first
            if not self.test_health_endpoints():
                print("❌ Health check failed - stopping tests")
                return False
            
            # Test auth endpoints
            if not self.test_auth_endpoints():
                print("❌ Auth tests failed - stopping tests")
                return False
            
            # Test shortcut endpoints
            if not self.test_shortcut_endpoints():
                print("❌ Shortcut tests failed")
                return False
            
            # Test folder endpoints
            if not self.test_folder_endpoints():
                print("❌ Folder tests failed")
                return False
            
            # Test tag endpoints
            if not self.test_tag_endpoints():
                print("❌ Tag tests failed")
                return False
            
            # Test export/import
            if not self.test_export_import():
                print("❌ Export/Import tests failed")
                return False
            
            return True
            
        finally:
            # Always cleanup
            self.cleanup_resources()

def main():
    tester = TextGrowAPITester()
    
    success = tester.run_all_tests()
    
    # Print final results
    print("\n" + "="*60)
    print("FINAL TEST RESULTS")
    print("="*60)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"✅ Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if success and tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())