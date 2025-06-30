# Quick Setup Guide

## For Windows Users

1. **Double-click** `start.bat` 
2. Choose option when prompted:
   - Type `--setup` and press Enter to setup the project
   - Type `--run` and press Enter to run the server

## For Mac/Linux Users

1. **Open Terminal** in this folder
2. Make the script executable: `chmod +x start.sh`
3. Run setup: `./start.sh --setup`
4. Run server: `./start.sh --run`

## Alternative (All Platforms)

```bash
# Setup project
python start.py --setup

# Run server
python start.py --run
```

## What happens during setup?

1. ✅ Checks Python version (3.8+ required)
2. 📦 Creates virtual environment
3. 📚 Installs dependencies
4. ⚙️ Creates .env configuration file
5. 📁 Sets up logs directory
6. 🔗 Tests backend connection

## After Setup

1. **Update .env file** with your configuration
2. **Start Express backend** (separate terminal): `cd ../backend && npm run dev`
3. **Run AI ChatBot**: `python start.py --run`
4. **Open browser**: http://localhost:8000/docs

## Need Help?

- Check the full README.md for detailed instructions
- Ensure Express backend is running on port 3000
- Check logs in the `logs/` folder for errors
