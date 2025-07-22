from mysql.connector import connect, Error as MySQLError
from fastapi import APIRouter, Depends, HTTPException, status
from ...db.database import create_connection
router = APIRouter()

@router.get("/stats")
def get_stats():
    try:
        conn = create_connection()
        cursor = conn.cursor(dictionary=True)

        # Start with just basic counts that are most likely to work
        total_users = 0
        total_services = 0
        total_requests = 0
        completed_services = 0
        total_credits_exchanged = 0
        # total_mod_requests = 0

        # Total users
        try:
            cursor.execute("SELECT count(*) as total_users FROM users")
            total_users = cursor.fetchall()[0]["total_users"]
            print(f"Total users: {total_users}")
        except Exception as e:
            print(f"Error counting users: {e}")

        # Total services
        try:
            cursor.execute("SELECT count(*) as total_services FROM services")
            total_services = cursor.fetchall()[0]["total_services"]
            print(f"Total services: {total_services}")
        except Exception as e:
            print(f"Error counting services: {e}")

        # Total service requests
        try:
            cursor.execute("SELECT count(*) as total_requests FROM requests")
            total_requests = cursor.fetchall()[0]["total_requests"]
            print(f"Total requests: {total_requests}")
        except Exception as e:
            print(f"Error counting requests: {e}")
            total_requests = 0

        # Total completed services
        try:
            cursor.execute("SELECT count(*) as completed_services FROM service_bookings WHERE status = 'completed'")
            completed_services = cursor.fetchall()[0]["completed_services"]
            print(f"Completed services: {completed_services}")
        except Exception as e:
            print(f"Error counting completed services: {e}")

        # Total credits exchanged
        try:
            cursor.execute("SELECT SUM(amount) as total_credits_exchanged FROM time_transactions WHERE amount > 0")
            result = cursor.fetchall()[0]
            total_credits_exchanged = float(result["total_credits_exchanged"]) if result["total_credits_exchanged"] is not None else 0
            print(f"Total credits exchanged: {total_credits_exchanged}")
        except Exception as e:
            print(f"Error summing credits: {e}")
            total_credits_exchanged = 0

        # Total moderator requests
        # try:
        #     cursor.execute("SELECT count(*) as total_mod_requests FROM mod_requests")
        #     total_mod_requests = cursor.fetchall()[0]["total_mod_requests"]
        # except Exception as e:
        #     print(f"Error counting mod requests: {e}")

        conn.close()
        data = {
            "total_users": total_users,
            "total_services": total_services,
            "total_requests": total_requests,
            "completed_services": completed_services,
            "total_credits_exchanged": total_credits_exchanged,
            # "total_mod_requests": total_mod_requests
        }
        print(data)
        return data
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        print(f"Database error in /admin/stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")