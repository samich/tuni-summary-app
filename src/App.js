import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';
import { TypeAnimation } from 'react-type-animation';
import './App.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
function App() {
  const [numPages, setNumPages] = useState(null);
  const [pdfText, setPdfText] = useState('');
  const [summary, setSummary] = useState('');
  const [summary2, setSummary2] = useState('');
  const [displayOriginal, setDisplayOriginal] = useState(false); 

  const onFileChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onloadend = async () => {
      const typedArray = new Uint8Array(reader.result);
      const pdf = await pdfjs.getDocument(typedArray).promise;
      let text = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const pageText = await page.getTextContent();
        pageText.items.forEach((item) => {
          text += item.str + ' ';
        });
      }

      setPdfText(text);
      setNumPages(pdf.numPages);
      
      summarizeByHugginface(text);
      summarizeByMeaningcloud(text);
      
    };

    if (file) {
      reader.readAsArrayBuffer(file);
    }
  };

  const summarizeByMeaningcloud = async (text) => {
    try {
      const response = await fetch('https://api.meaningcloud.com/summarization-1.0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          key: '168c83abbd6a867f05bccecd5d0abb69',
          txt: text,
          sentences: 5,
          src: 'react-pdf-summary',
          of: 'json',
        }),
      });

      const data = await response.json();
      const summary = data.summary ? data.summary : 'No summary available';

      setSummary(summary);
    } catch (error) {
      alert(error)
      console.error('Error:', error);
    }
  };

  const summarizeByHugginface = async (text) => {
    try {
      const response = await axios.post('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
        inputs: text,
        parameters: {
          max_new_tokens: 50,
          min_length: 0,
          max_length: 200,
          early_stopping: true,
        },
      }, {
        headers: {
          'Authorization': 'Bearer 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',
        },
      });

      console.log(response);

      setSummary2(response.data[0].summary_text.trim());

    } catch (error) {

      console.error('Error:', error);

    }
  };  

  const toggleOriginal = () => {
    setDisplayOriginal(!displayOriginal);
  };


  return (
    <div>
      <div className="header">
          
        <div className="container">
          <h1>PDF Summarization Web Application</h1>
          <h2>A simple react app to get summerize PDF Documents using huggingface and MeaningCloud.</h2>

          <div class="btnwrap">
            <input id="fileInput" type="file" accept=".pdf" className="fileInput" onChange={onFileChange}/>
            <label htmlFor="fileInput" className="fileInputLabel">Choose File</label>
          </div>
        </div>

      </div>

      <div class="content">
      <div class="container">

        <div class="boxes">
          <div class="box1">
          <h3>Summary by MeaningCloud:</h3>
          {summary && (
            <TypeAnimation
              sequence={[summary]}
              wrapper="span"
              speed={50}
              cursor={true}
              style={{ fontSize: '1.2em' }}
            />
          )}
          </div>

          <div class="box2">
          <h3>Summary by HugginFace:</h3>
          {summary2 && (
          <TypeAnimation
            sequence={[summary2]}
            wrapper="span"
            speed={50}
            cursor={true}
            style={{ fontSize: '1.2em' }}
          />
        )}
          </div>

        </div>

      {pdfText && (
        <div>
        <button className="btn" onClick={toggleOriginal}>
          {displayOriginal ? 'Hide Original' : 'Display Original'}
        </button>
        {displayOriginal && <p className='original'>{pdfText}</p>}
        </div>
      )}

      </div>
      </div>
     
    </div>
  );
}

export default App;
