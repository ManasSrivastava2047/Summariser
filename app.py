from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import google.generativeai as genai
import os
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import PyPDF2
import docx
from gtts import gTTS
import tempfile
import base64

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'your-secret-key-here')

# Configure Gemini API
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable is required")
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-1.5-flash')

# Upload configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_file(filepath):
    """Extract text from uploaded files"""
    file_extension = filepath.rsplit('.', 1)[1].lower()
    
    if file_extension == 'txt':
        with open(filepath, 'r', encoding='utf-8') as file:
            return file.read()
    
    elif file_extension == 'pdf':
        text = ""
        with open(filepath, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text()
        return text
    
    elif file_extension == 'docx':
        doc = docx.Document(filepath)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    
    return ""

def generate_summary(text):
    """Generate summary using Gemini API"""
    try:
        prompt = f"""
        You are an avatar that provides summarised versions of long texts to the user. Provide the summary that's understandable but also doesn't 
        miss out the details in any sense. Keep its length relative to the text for example if it's 500 words para try to complete it in 100-150 words
        and same for relevant file size. The text is given to you as:
        
        {text}
        """
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating summary: {str(e)}"

def generate_audio(text):
    """Generate audio from text using gTTS"""
    try:
        print(f"[DEBUG] Generating audio for text length: {len(text)}")
        tts = gTTS(text=text, lang='en', slow=False)
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
            tts.save(tmp_file.name)
            print(f"[DEBUG] Audio saved to temporary file: {tmp_file.name}")
            
            # Read the file and encode as base64
            with open(tmp_file.name, 'rb') as audio_file:
                audio_data = base64.b64encode(audio_file.read()).decode('utf-8')
            
            # Clean up temporary file
            os.unlink(tmp_file.name)
            
            print(f"[DEBUG] Audio generated successfully, base64 length: {len(audio_data)}")
            return audio_data
    except Exception as e:
        print(f"[ERROR] Error generating audio: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/submit', methods=['POST'])
def submit():
    text_input = request.form.get('text_input', '').strip()
    uploaded_file = request.files.get('file_upload')
    
    content = ""
    
    # Process text input
    if text_input:
        content = text_input
    
    # Process file upload
    elif uploaded_file and uploaded_file.filename != '':
        if allowed_file(uploaded_file.filename):
            filename = secure_filename(uploaded_file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            uploaded_file.save(filepath)
            
            content = extract_text_from_file(filepath)
            
            # Clean up uploaded file
            os.remove(filepath)
        else:
            return render_template('index.html', error="Invalid file type. Please upload TXT, PDF, or DOCX files.")
    
    if not content:
        return render_template('index.html', error="Please provide text input or upload a file.")
    
    # Generate summary
    summary = generate_summary(content)
    
    # Generate audio
    print(f"[DEBUG] Starting audio generation for summary length: {len(summary)}")
    audio_data = generate_audio(summary)
    
    if audio_data:
        print("[DEBUG] Audio generation successful")
    else:
        print("[DEBUG] Audio generation failed")
    
    # Store in session
    session['summary'] = summary
    session['audio_data'] = audio_data
    session['original_content'] = content[:500] + "..." if len(content) > 500 else content
    
    return redirect(url_for('results'))

@app.route('/results')
def results():
    summary = session.get('summary')
    audio_data = session.get('audio_data')
    original_content = session.get('original_content')
    
    if not summary:
        return redirect(url_for('index'))
    
    return render_template('results.html', 
                         summary=summary, 
                         audio_data=audio_data,
                         original_content=original_content)

if __name__ == '__main__':
    app.run(debug=True)
