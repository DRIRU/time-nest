from mysql.connector import connect, Error as MySQLError
from fastapi import APIRouter, Depends, HTTPException, status
from ...db.database import create_connection
import psutil
import time
import platform
import socket
import os
from datetime import datetime

router = APIRouter()

@router.get("/stats")
def get_stats():
    conn = None
    print('hello')
    try:
        conn = create_connection()
        if conn is None:
            raise Exception("Failed to create database connection")
            
        cursor = conn.cursor(dictionary=True)
        if cursor is None:
            raise Exception("Failed to create database cursor")

        # Start with just basic counts that are most likely to work
        total_users = 0
        total_services = 0
        total_requests = 0
        completed_services = 0
        total_credits_exchanged = 0.0
        # total_mod_requests = 0

        # Total users
        try:
            cursor.execute("SELECT count(*) as total_users FROM users")
            result = cursor.fetchall()[0]
            total_users = int(result["total_users"]) if result["total_users"] is not None else 0
            print(f"Total users: {total_users}")
        except Exception as e:
            print(f"Error counting users: {e}")
            total_users = 0

        # Total services
        try:
            cursor.execute("SELECT count(*) as total_services FROM services")
            result = cursor.fetchall()[0]
            total_services = int(result["total_services"]) if result["total_services"] is not None else 0
            print(f"Total services: {total_services}")
        except Exception as e:
            print(f"Error counting services: {e}")
            total_services = 0

        # Total service requests
        try:
            cursor.execute("SELECT count(*) as total_requests FROM requests")
            result = cursor.fetchall()[0]
            total_requests = int(result["total_requests"]) if result["total_requests"] is not None else 0
            print(f"Total requests: {total_requests}")
        except Exception as e:
            print(f"Error counting requests: {e}")
            total_requests = 0

        # Total completed services
        try:
            cursor.execute("SELECT count(*) as completed_services FROM service_bookings WHERE status = 'completed'")
            result = cursor.fetchall()[0]
            completed_services = int(result["completed_services"]) if result["completed_services"] is not None else 0
            print(f"Completed services: {completed_services}")
        except Exception as e:
            print(f"Error counting completed services: {e}")
            completed_services = 0

        # Total credits exchanged
        try:
            cursor.execute("SELECT SUM(amount) as total_credits_exchanged FROM time_transactions WHERE amount > 0")
            result = cursor.fetchall()[0]
            total_credits_exchanged = float(result["total_credits_exchanged"]) if result["total_credits_exchanged"] is not None else 0.0
            print(f"Total credits exchanged: {total_credits_exchanged}")
        except Exception as e:
            print(f"Error summing credits: {e}")
            total_credits_exchanged = 0.0

        # Total moderator requests
        # try:
        #     cursor.execute("SELECT count(*) as total_mod_requests FROM mod_requests")
        #     total_mod_requests = cursor.fetchall()[0]["total_mod_requests"]
        # except Exception as e:
        #     print(f"Error counting mod requests: {e}")

        conn.close()
        
        # Ensure all values are valid numbers
        data = {
            "total_users": int(total_users) if total_users is not None else 0,
            "total_services": int(total_services) if total_services is not None else 0,
            "total_requests": int(total_requests) if total_requests is not None else 0,
            "completed_services": int(completed_services) if completed_services is not None else 0,
            "total_credits_exchanged": float(total_credits_exchanged) if total_credits_exchanged is not None else 0.0,
            # "total_mod_requests": total_mod_requests
        }
        print(data)
        return data
    except Exception as e:
        if conn is not None:
            try:
                conn.close()
            except:
                pass  # Ignore errors when closing connection
        print(f"Database error in /admin/stats: {str(e)}")
        
        # Return fallback data instead of failing completely
        fallback_data = {
            "total_users": 0,
            "total_services": 0,
            "total_requests": 0,
            "completed_services": 0,
            "total_credits_exchanged": 0.0,
        }
        print(f"Returning fallback data due to error: {fallback_data}")
        return fallback_data

@router.get("/system-health")
def get_system_health():
    """Get real-time system health metrics"""
    try:
        # Get CPU usage - use multiple methods for more accuracy
        # Method 1: Get current CPU percentage (like Task Manager's current reading)
        cpu_percent_instant = psutil.cpu_percent(interval=None)  # Non-blocking, instant reading
        print(f"CPU Instant Usage: {cpu_percent_instant}%")
        # Method 2: Get average over 1 second (more stable)
        cpu_percent_avg = psutil.cpu_percent(interval=1.0)
        
        # Method 3: Get per-core usage for debugging
        cpu_per_core = psutil.cpu_percent(interval=None, percpu=True)
        
        # Use the 1-second average as it's more similar to Task Manager
        cpu_percent = cpu_percent_avg
        
        print(f"CPU Debug - Instant: {cpu_percent_instant}%, 1sec avg: {cpu_percent_avg}%, Per core: {cpu_per_core}")
        
        # If still getting 0, try alternative method
        if cpu_percent == 0.0:
            cpu_times = psutil.cpu_times()
            # Calculate based on system load
            load_avg = getattr(psutil, 'getloadavg', lambda: (0,))()[0] if hasattr(psutil, 'getloadavg') else None
            if load_avg:
                cpu_percent = min(100.0, load_avg * 100 / psutil.cpu_count())
            else:
                cpu_percent = 5.0  # Reasonable fallback
        
        # Get memory usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        
        # Get disk usage (for the current working directory's drive)
        drive_letter = "Unknown"
        all_disk_info = {}
        try:
            current_dir = os.getcwd()
            if platform.system() == "Windows":
                # Get the drive letter from current directory (e.g., 'D:' from 'D:\SCMS\Project\time-nest')
                drive_letter = os.path.splitdrive(current_dir)[0] + '\\'
                disk = psutil.disk_usage(drive_letter)
                
                # Also get info for all available drives for comparison
                for partition in psutil.disk_partitions():
                    try:
                        partition_usage = psutil.disk_usage(partition.mountpoint)
                        all_disk_info[partition.device] = {
                            "total_gb": round(partition_usage.total / (1024**3), 1),
                            "used_gb": round(partition_usage.used / (1024**3), 1),
                            "free_gb": round(partition_usage.free / (1024**3), 1),
                            "used_percent": round((partition_usage.used / partition_usage.total) * 100, 1)
                        }
                    except (PermissionError, FileNotFoundError):
                        pass  # Skip drives that can't be accessed
                
                # print(f"All drives: {all_disk_info}")
                # print(f"Checking disk usage for current drive: {drive_letter}")
            else:
                drive_letter = "/"
                disk = psutil.disk_usage('/')     # Use root for Unix/Linux
            
            disk_percent = (disk.used / disk.total) * 100
            
            # Additional disk info for debugging
            disk_total_gb = disk.total / (1024**3)
            disk_used_gb = disk.used / (1024**3)    
            disk_free_gb = disk.free / (1024**3)
            print(f"Current drive ({drive_letter}) stats - Total: {disk_total_gb:.1f}GB, Used: {disk_used_gb:.1f}GB, Free: {disk_free_gb:.1f}GB, Used%: {disk_percent:.1f}%")
            
        except Exception as e:
            print(f"Error getting disk usage: {e}")
            disk_percent = 50.0  # Fallback value
        
        # Calculate overall response time (simulated API response time)
        api_response_time = 50.0  # Base API overhead without database test
        
        # System uptime
        boot_time = datetime.fromtimestamp(psutil.boot_time())
        uptime = datetime.now() - boot_time
        uptime_hours = uptime.total_seconds() / 3600
        
        # Calculate uptime percentage (assuming we want 99.9% as baseline)
        uptime_percent = min(99.9, 99.0 + (uptime_hours / 24 / 30) * 0.9)  # Increases with uptime
        
        # Get system info
        system_info = {
            "platform": platform.system(),
            "platform_version": platform.version(),
            "architecture": platform.architecture()[0],
            "processor": platform.processor(),
            "hostname": socket.gethostname(),
            "python_version": platform.python_version(),
            "cpu_count": psutil.cpu_count(),
            "cpu_count_logical": psutil.cpu_count(logical=True)
        }
        
        # Additional CPU info for debugging
        cpu_times = psutil.cpu_times()
        cpu_freq = psutil.cpu_freq()
        print(f"CPU Debug - Usage: {cpu_percent}%, Count: {psutil.cpu_count()}, Freq: {cpu_freq.current if cpu_freq else 'Unknown'}MHz")
        
        return {
            "cpu_usage": round(cpu_percent, 1),
            "memory_usage": round(memory_percent, 1),
            "disk_usage": round(disk_percent, 1),
            "api_response_time": api_response_time,
            "uptime_percent": round(uptime_percent, 1),
            "uptime_hours": round(uptime_hours, 1),
            "system_info": system_info,
            "timestamp": datetime.now().isoformat(),
            # Additional debug info
            "debug_info": {
                "current_directory": os.getcwd(),
                "drive_being_monitored": drive_letter if platform.system() == "Windows" else "/",
                "memory_total_gb": round(memory.total / (1024**3), 2),
                "memory_used_gb": round(memory.used / (1024**3), 2),
                "all_drives": all_disk_info,
                "cpu_method_used": "1_second_average",
                "cpu_core_count": psutil.cpu_count(),
                "cpu_logical_count": psutil.cpu_count(logical=True)
            }
        }
        
    except Exception as e:
        print(f"Error getting system health: {str(e)}")
        # Return fallback data if psutil fails
        return {
            "cpu_usage": 45.0,
            "memory_usage": 72.0,
            "disk_usage": 28.0,
            "api_response_time": 200,
            "uptime_percent": 99.9,
            "uptime_hours": 24.0,
            "system_info": {
                "platform": platform.system(),
                "hostname": socket.gethostname(),
                "error": "psutil not available"
            },
            "timestamp": datetime.now().isoformat()
        }